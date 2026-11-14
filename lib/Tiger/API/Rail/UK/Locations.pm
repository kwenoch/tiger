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
package Tiger::API::Rail::UK::Locations;

use strict;
use warnings;

use File::Basename qw( dirname );
use JSON;
use Mojo::Base 'Mojolicious::Controller', -signatures;

use Tiger::Env::Config;

sub list {
    my ($app)        = @_;
    my ($controller) = $app->openapi->valid_input or return;

    my $filename = dirname( __FILE__ ) . "/Locations.json";
    my $file = do {
        local $/ = undef;
        open my $fh, "<", $filename
            or die "ERROR:\tcould not open $filename: $!";
        <$fh>;
    };

    return $controller->render(
        openapi => JSON->new->decode( $file ),
    );
}

1;
