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
package Tiger::API::Bus::UK::Citybus::Locations;

use strict;
use warnings;

use HTTP::Request;
use JSON;
use LWP::UserAgent;
use Mojo::Base 'Mojolicious::Controller', -signatures;

use Tiger::Env::Config;

sub list {
    my ($app)        = @_;
    my ($controller) = $app->openapi->valid_input or return;

    my $location = $controller->param('location') || '50.3702786,-4.1424065';
    my @location = split ',', $location;
    my $centre_x = $location[0];
    my $centre_y = $location[1];

    my $bound_x_pos = $centre_x + 0.0025;
    my $bound_y_pos = $centre_y - 0.005;
    my $bound_x_neg = $centre_x - 0.0025;
    my $bound_y_neg = $centre_y + 0.005;

    my $bound_pos = $bound_x_pos . ',' . $bound_y_pos;
    my $bound_neg = $bound_x_neg . ',' . $bound_y_neg;

    return $controller->render(
        status  => 500,
        openapi => {
            errors => [
                {
                    error   => 'internal_server_error',
                    message => 'location is invalid size',
                }
            ],
        },
    ) unless scalar(@location) eq 2;

    my $config  = Tiger::Env::Config->new;
    my $baseurl = $config->{bus}->{citybus}->{api}->{upstream_api_url}->{v1};

    my $request = HTTP::Request->new(
        'GET',
        $baseurl . '/_ajax/stops?bounds[]=' . $bound_pos . '&bounds[]=' . $bound_neg
    );
    my $ua = LWP::UserAgent->new;
    print STDERR $baseurl . '/_ajax/stops?bounds[]=' . $bound_pos . '&bounds[]=' . $bound_neg;

    $request->header( 'User-Agent'   => 'perl/"$^V' );
    $request->header( 'Content-Type' => 'application/json' );

    my $response = $ua->request($request);
    my $content  = JSON->new->decode( $response->{_content} );

    return $controller->render(
        openapi => $content,
    );
}

1;
