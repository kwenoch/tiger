//  This file is part of tiger
//
//  Copyright 2025 PerplexedTheta
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

const API = class {
    constructor(config) {
        this.jQuery = config.jquery;

        this.location = config.location
            ? config.location
            : "50.3702786,-4.1424065";
    }

    init = () => {
        return;
    };

    getLocations = () => {
        return this.jQuery.get(
            "/api/v1/bus/uk/citybus/locations?location=" + this.location,
        );
    };

    getServices = (stopId) => {
        return this.jQuery.get("/api/v1/bus/uk/citybus/services/" + stopId);
    };

    getUpdates = (stopId) => {
        return this.jQuery.get('/api/v1/bus/uk/citybus/services/' + stopId + '/updates');
    };

    getLocation = () => {
        return this.location;
    };
};

export default API;
