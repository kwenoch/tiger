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
package Tiger::Controller;

use strict;
use warnings;

use Modern::Perl;

sub new {
    my ( $class, $args ) = @_;
    my $self = {};

    $self->{'app'} = $args->{'app'}
        or return;

    bless( $self, $class );
    return $self;
}

sub plugins {
    my ($self) = @_;

    return $self->{'app'}->plugin(
        'TemplateToolkit' => {
            template => {
                INCLUDE_PATH => $self->{'app'}->home->rel_file('templates/'),
                INTERPOLATE  => 1
            }
        }
    );
}

sub routes {
    my ($self) = @_;
    my $r = $self->{'app'}->routes
        or return;

    ## set routes
    $r->any('/bus')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Errors',
        action     => 'forbidden',
    );
    $r->any('/bus/uk')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Errors',
        action     => 'forbidden',
    );
    $r->get('/bus/uk/citybus')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::CityBus::Mainpage',
        action     => 'mainpage',
    );
    $r->get('/bus/uk/citybus/:stop_id/arrivees')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::CityBus::Arrivees',
        action     => 'arrivees',
    );
    $r->get('/bus/uk/citybus/:stop_id/departs')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::CityBus::Departs',
        action     => 'departs',
    );
    $r->get('/bus/uk/woe')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::WoE::Mainpage',
        action     => 'mainpage',
    );
    $r->get('/bus/uk/woe/:stop_id/arrivees')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::WoE::Arrivees',
        action     => 'arrivees',
    );
    $r->get('/bus/uk/woe/:stop_id/departs')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Bus::UK::WoE::Departs',
        action     => 'departs',
    );
    $r->any('/rail')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Errors',
        action     => 'forbidden',
    );
    $r->get('/rail/uk')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Rail::UK::Mainpage',
        action     => 'mainpage',
    );
    $r->get('/rail/uk/:tiploc_id/arrivees')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Rail::UK::Arrivees',
        action     => 'arrivees',
    );
    $r->get('/rail/uk/:tiploc_id/departs')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Rail::UK::Departs',
        action     => 'departs',
    );
    $r->any('/')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Index',
        action     => 'mainpage',
    );
    $r->any('*')->to(
        namespace  => 'Tiger',
        controller => 'Controller::Errors',
        action     => 'notFound',
    );

    return $r;
}

1;
