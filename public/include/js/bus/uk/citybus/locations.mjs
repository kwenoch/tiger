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

const Locations = class {
    constructor(config) {
        this.api = config.api;
        this.jQuery = config.jquery;
        this.postcode = config.postcode;
    }

    init = async () => {
        let lat = jQuery('input[name="search-lat-input"]').val();
        let long = jQuery('input[name="search-long-input"]').val();

        if (lat && long) this.api.location = "" + lat + "," + long;

        return this.build().then(() => {
            this.handleSearchArea();
            this.handleFilter();
        });
    };

    build = async () => {
        return this.api
            .getLocations()
            .done((data) => {
                this.locations = data.features;
            })
            .then(() => {
                this.resetDOM();

                this.locations.forEach((location, idx) => {
                    location = location.properties;
                    let id = location.atcoCode;
                    let name = location.commonName.replace(/\s+/g," ").trim();
                    let bearing = location.bearing;
                    let dom = this.loadDOM(id, name);

                    this.setStop(dom, name, bearing);
                    this.setDeparts(dom, id);

                    this.commitDOM(dom);
                });
            })
            .fail((error) => {
                if (error.responseJSON.errors) {
                    let errors = error.responseJSON.errors;

                    return this.throwError(errors[0].error, errors[0].message);
                }
            });
    };

    throwError = (code, message) => {
        let dom = this.loadDOM("");

        this.setLine(dom, "", false);
        this.setCalls(dom, [{ Name: message }]);

        this.commitDOM(dom);

        return {
            error: {
                code: code,
                message: message,
            },
        };
    };

    loadDOM = (id, name = "") => {
        // initialise object
        let dom = this.jQuery("<li>");
        dom.addClass("list-group-item");
        dom.attr("data-id", id);
        dom.attr("data-name", name.toUpperCase());

        dom.html(
            '<strong>#STATION<\/strong> | <a href=\"#DEPARTS\">Departures<\/a>',
        );

        return dom;
    };

    commitDOM = (dom) => {
        return this.jQuery("ul.list-group").first().append(dom);
    };

    resetDOM = () => {
        return this.jQuery("ul.list-group").text("");
    };

    handleSearchArea = () => {
        let lat = "" + jQuery('input[name="search-lat-input"]').first().val();
        let long = "" + jQuery('input[name="search-long-input"]').first().val();
        let location = lat + "," + long;
        this.commitHistory(
            { page_id: "Tiger::Controller::Bus::UK::Citybus::Mainpage#mainpage" },
            window.location.pathname + "?location=" + location,
        );

        this.jQuery('input[name="search-postcode-input"]')
            .first()
            .removeAttr("disabled");

        this.jQuery('input[name="search-postcode-input"]')
            .first()
            .on("change keyup paste", () => {
                let postcode = jQuery('input[name="search-postcode-input"]')
                    .first()
                    .val();

                if (postcode.length < 6) return;

                this.postcode
                    .getPostcode(postcode)
                    .done((data) => {
                        lat = data.result.latitude;
                        long = data.result.longitude;
                        location = lat + "," + long;

                        jQuery('input[name="search-lat-input"]')
                            .first()
                            .val(lat);
                        jQuery('input[name="search-long-input"]')
                            .first()
                            .val(long);
                    })
                    .then(() => {
                        this.commitHistory(
                            {
                                page_id:
                                    "Tiger::Controller::Bus::UK::Citybus::Mainpage#mainpage",
                            },
                            window.location.pathname + "?location=" + location,
                        );

                        this.api.location = location;
                    })
                    .then(() => {
                        this.build();
                    });
            });

        return;
    };

    handleFilter = () => {
        this.jQuery('input[name="filter-input"]')
            .first()
            .removeAttr("disabled");

        this.jQuery('input[name="filter-input"]')
            .first()
            .on("change keyup paste", () => {
                const value = this.jQuery('input[name="filter-input"]')
                    .first()
                    .val()
                    .toUpperCase();

                this.jQuery("li.list-group-item").each((idx, element) => {
                    if (value == "") {
                        this.jQuery(element).show();
                    } else if (
                        this.jQuery(element).is("[data-name*='" + value + "']")
                    ) {
                        this.jQuery(element).show();
                    } else {
                        this.jQuery(element).hide();
                    }
                });
            });

        return;
    };

    commitHistory = (state, url) => {
        return history.pushState(state, undefined, url);
    };

    setDeparts = (dom, id) => {
        return dom
            .find('a[href="#DEPARTS"]')
            .first()
            .attr("href", "/bus/uk/citybus/" + id + "/departs");
    };

    setStop = (dom, name = "") => {
        return dom
            .find("strong")
            .first()
            .text(name);
    };
};

export default Locations;
