#   This file is part of tiger
#
#   Copyright 2025 PerplexedTheta
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
package Tiger::API::Bus::UK::Citybus::Services;

use strict;
use warnings;

use HTTP::Request;
use JSON;
use LWP::UserAgent;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use Mojo::DOM;
use Time::Piece;

use Tiger::Env::Config;

sub get {
    my ($app)        = @_;
    my ($controller) = $app->openapi->valid_input or return;
    my $json         = $controller->req->json;

    my $stopId = $controller->param('stop_id');

    my $config  = Tiger::Env::Config->new;
    my $baseurl = $config->{bus}->{citybus}->{api}->{upstream_api_url}->{v1};

    my $request = HTTP::Request->new( 'GET', $baseurl . '/stops/' . $stopId );
    my $ua      = LWP::UserAgent->new;

    $request->header( 'User-Agent' => 'perl/"$^V' );

    if ( $config->{bus}->{citybus}->{api}->{upstream_api_use_xmlhttprequest} eq 'true' ) {
        $request->header( 'X-Requested-With' => 'XMLHttpRequest' );
    }

    my $response = $ua->request($request);

    return $controller->render(
        status  => 404,
        openapi => {
            errors => [
                {
                    error   => 'not_found',
                    message => 'no stop_id found',
                }
            ],
        },
    ) unless $stopId and $response->{_rc} == 200;

    my ( $name, $tablet ) = _process_metadata( $response->{_content} );

    $name = $name . ' ' . $tablet
        if $tablet;

    my $services = _process_timetable( $response->{_content} );

    return $controller->render(
        openapi => {
            id       => $stopId,
            name     => $name,
            services => $services,
        }
    );
}

sub updates {
    my ($app)        = @_;
    my ($controller) = $app->openapi->valid_input or return;
    my $json         = $controller->req->json;

    my $stopId = $controller->param('stop_id');

    my $config  = Tiger::Env::Config->new;
    my $baseurl = $config->{bus}->{citybus}->{api}->{upstream_api_url}->{v1};

    my $request = HTTP::Request->new( 'GET', $baseurl . '/stops/' . $stopId . '/updates' );
    my $ua      = LWP::UserAgent->new;

    $request->header( 'User-Agent' => 'perl/"$^V' );

    if ( $config->{bus}->{citybus}->{api}->{upstream_api_use_xmlhttprequest} eq 'true' ) {
        $request->header( 'X-Requested-With' => 'XMLHttpRequest' );
    }

    my $response = $ua->request($request);

    return $controller->render(
        status  => 404,
        openapi => {
            errors => [
                {
                    error   => 'not_found',
                    message => 'no stop_id found',
                }
            ],
        },
    ) unless $stopId and $response->{_rc} == 200;

    my $updates = _process_updates( $response->{_content} );

    return $controller->render(
        openapi => {
            id      => $stopId,
            updates => $updates,
        }
    );
}

sub _process_metadata {
    my ($content) = @_;
    my $dom = Mojo::DOM->new($content);
    my ( $name, $tablet );

    $name = $dom->at('h1.place-info-banner__name')->text
        if $dom->at('h1.place-info-banner__name');
    $tablet = $dom->at('span.place-info-banner__tablet')->text
        if $dom->at('span.place-info-banner__tablet');

    $name =~ s/^\s+|\s+$//g
        if $name;
    $tablet =~ s/^\s+|\s+$//g
        if $tablet;

    return ( $name, $tablet );
}

sub _process_timetable {
    my ($content) = @_;
    my $dom = Mojo::DOM->new($content);
    my @array;

    $dom->find('li.departure-board__item')->each(
        sub {
            my $uid = undef;

            $uid = _process_uid( $_->at('a.single-visit')->attr('data-journey') )
                unless not defined $_->at('a.single-visit');

            return
                unless defined $_->at('div.single-visit__name');

            my $object = {
                journey     => $uid,
                line        => _trim( $_->at('div.single-visit__name')->text ),
                destination => _trim( $_->at('div.single-visit__description')->text ),
                std         =>
                    _process_std( $_->at('div.single-visit__arrival-time div.single-visit__arrival-time__cell')->text ),
                etd => _process_etd(
                    $_->at('div.real-time-animation'),
                    _trim( $_->at('div.single-visit__arrival-time div.single-visit__arrival-time__cell')->text )
                ),
            };

            return push @array, $object;
        }
    );

    return \@array;
}

sub _process_updates {
    my ($content) = @_;
    my $dom = Mojo::DOM->new($content);
    my @array;

    $dom->find('div.disruption-item')->each(
        sub {
            my $uid = undef;
            my @affects;

            return
                unless defined $_->at('h3.disruption-item__title');

            $uid = $_->at('h3.disruption-item__title')->attr('id');

            $_->find('ul.c-disruption__affected-entities div.line-block__contents')->each(
                sub {
                    my $affect = _trim( $_->text );

                    return push @affects, $affect;
                }
            );

            my $object = {
                update => $uid,
                meta   => {
                    date    => _trim( $_->at('p.disruption-item__meta')->text ),
                    affects => \@affects,
                },
                title       => _trim( $_->at('h3.disruption-item__title a')->text ),
                description => _trim( $_->find('p')->last->text ),
            };

            return push @array, $object;
        }
    );

    return \@array;
}

sub _process_uid {
    my ($uid) = @_;

    ($uid) = $uid =~ /([a-zA-Z]*\:[a-zA-Z0-9]*:[0-9]*:[a-zA-Z0-9]*:[a-zA-Z]*:[0-9]*)/;
    return $uid;
}

sub _process_std {
    my ($time) = @_;
    my $epoch = localtime;

    my $payload = {
        due => $time,
    };

    if ( index( $time, ' min' ) != -1 ) {
        my ($mins)     = split /[:\s]+/, $time, 2;
        my $futuretime = $epoch + ( $mins * 60 );

        $payload->{due} = $futuretime->strftime(qq/%H:%M/);
    }

    $payload->{due} = $epoch->strftime(qq/%H:%M/)
        if ( index( $time, 'Due' ) != -1 );

    return $payload;
}

sub _process_etd {
    my ( $status, $time ) = @_;
    my $payload = {
        real_time => ($status) ? JSON::true : JSON::false,
        due       => undef,
    };

    return $payload
        unless $time;

    if ( index( $time, 'min' ) != -1 || index( $time, 'Due' ) != -1 ) {
        $payload->{due} = $time;
    }

    return $payload;
}

sub _trim {
    my ($string) = @_;

    return
        unless $string;

    $string =~ s/^\s+|\s+$//g;
    return $string;
}

1;
