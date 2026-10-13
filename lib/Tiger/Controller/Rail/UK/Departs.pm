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
package Tiger::Controller::Rail::UK::Departs;

use strict;
use warnings;

use Modern::Perl;
use Mojo::Base 'Mojolicious::Controller', -signatures;

sub departs {
    my ($controller) = @_ or return;
    my ($app)        = $controller->app;

    my $tiplocId = $controller->param('tiploc_id') or return;

    my $greyscale    = ( $controller->param('greyscale') )     ? 'greyscale' : undef;
    my $hideCalls    = ( $controller->param('hide_calls') )    ? 1           : undef;
    my $hideSecs     = ( $controller->param('hide_secs') )     ? 1           : undef;

    ## render the template
    return $controller->render(
        greyscale     => $greyscale,
        hide_calls    => $hideCalls,
        hide_secs     => $hideSecs,
        tiploc_id     => $tiplocId,
        title         => 'Departures from ' . $tiplocId,
        template      => 'rail/uk/departs',
        handler       => 'tt2',
    );
}

1;
