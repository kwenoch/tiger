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
    }

    init = async () => {
        return this.api
            .getLocations()
            .done((data) => {
                this.locations = data;
                this.resetDOM();

                this.locations.forEach((location, idx) => {
                    let tiploc = location.tiploc;
                    let name = location.name;
                    let dom = this.loadDOM(tiploc, name);

                    this.setStation(dom, name);
                    this.setArrivees(dom, tiploc);
                    this.setDeparts(dom, tiploc);

                    this.commitDOM(dom);
                });

                this.handleFilters();
            })
            .fail((error) => {
                console.error(error);
            });
    };

    loadDOM = (tiploc, name = "") => {
        // initialise object
        let dom = this.jQuery("<li>");
        dom.addClass("list-group-item");
        dom.attr("data-tiploc", tiploc);
        dom.attr("data-name", name.toUpperCase());

        dom.html(
            '<strong>#STATION<\/strong> | <a href=\"#DEPARTS\">Departures<\/a> | <a href=\"#ARRIVEES\">Arrivals<\/a>',
        );

        return dom;
    };

    commitDOM = (dom) => {
        return this.jQuery("ul.list-group").first().append(dom);
    };

    resetDOM = () => {
        return this.jQuery("ul.list-group").text("");
    };

    handleFilters = () => {
        this.jQuery('input[name="filter-input"]')
            .first()
            .removeAttr("disabled");

        return this.jQuery('input[name="filter-input"]')
            .first()
            .on("keyup", () => {
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
    };

    setArrivees = (dom, tiploc) => {
        return dom
            .find('a[href="#ARRIVEES"]')
            .first()
            .attr("href", "/rail/uk/" + tiploc + "/arrivees");
    };

    setDeparts = (dom, tiploc) => {
        return dom
            .find('a[href="#DEPARTS"]')
            .first()
            .attr("href", "/rail/uk/" + tiploc + "/departs");
    };

    setStation = (dom, name = "") => {
        return dom.find("strong").first().text(name);
    };
};

export default Locations;
