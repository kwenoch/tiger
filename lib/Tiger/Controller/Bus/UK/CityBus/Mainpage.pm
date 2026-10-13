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
package Tiger::Controller::Bus::UK::CityBus::Mainpage;

use strict;
use warnings;

use Modern::Perl;
use Mojo::Base 'Mojolicious::Controller', -signatures;

sub mainpage {
    my ($controller) = @_ or return;
    my ($app)        = $controller->app;

    my $location = $controller->param('location') || '50.3702786,-4.1424065';
    my ( $lat, $long ) = split /,/, $location;

    ## render the template
    return $controller->render(
        title    => 'Plymouth CityBus Times',
        lat      => $lat,
        long     => $long,
        template => 'bus/uk/citybus/mainpage',
        handler  => 'tt2',
    );
}

1;
