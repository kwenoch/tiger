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

const Bus = class {
    constructor(config) {
        this.mode = config.mode;
        this.stopId = config.stopId;
        this.api = config.api;
        this.jQuery = config.jquery;

        if (this.mode == undefined)
            return this.throwError(
                "no_mode",
                "No mode was specified for this object.",
            );
    }

    init = () => {
        this.api
            .getServices(this.stopId)
            .done((data) => {
                this.stop = data.stops[0];
                this.errors = data.errors;
            })
            .then(() => {
                this.setTitle(this.stop.name + " (" + this.stop.bearing + ")");
            });

        this.build()
            .then(() => {
                this.jQuery("div#loading").remove();
            })
            .catch((error) => {
                console.error(error);
            });

        return;
    };

    build = async () => {
        return this.api
            .getServices(this.stopId)
            .done((data) => {
                this.stop = data.stops[0];
                this.services = data.stops[0].services;
                this.routes = data.stops[0].routes;
                this.errors = data.errors;
            })
            .then(() => {
                let dom = this.createDOM();

                if (this.errors)
                    return this.throwError(
                        this.errors[0].error,
                        this.errors[0].message,
                    );

                if (this.services == undefined || this.services.length < 1)
                    return this.throwError(
                        "no_data",
                        "There is currently no bus information available.",
                    );

                this.services.forEach((service, idx) => {
                    // not implemented
                    if (this.mode == "arrivees") return;

                    service.route = this.routes.find((route) => {
                        return route.id == service.route_id;
                    });
                    delete service.route_id;

                    if (service.live_departures_seconds) {
                        service.live_departures_seconds.forEach((delta) => {
                            let now = new Date(Date.now());
                            let etd = new Date(Date.now());
                            etd.setUTCSeconds(delta);
                            delta = new Date(etd - now);

                            let uid = window.crypto.randomUUID();
                            let row = this.createRow(uid, etd.getTime());

                            let statusStr = "En-route";
                            let deltaStr =
                                (delta.getHours() - 1) * 60 +
                                delta.getMinutes() +
                                " mins";
                            let etdStr =
                                this.format(etd.getHours()) +
                                ":" +
                                this.format(etd.getMinutes());

                            if (
                                (delta.getHours() - 1) * 60 +
                                    delta.getMinutes() <
                                2
                            ) {
                                deltaStr = "";
                                statusStr = "Due";
                            }

                            this.setOper(row, service.route.brand);
                            this.setStatus(row, statusStr);
                            this.setAddInfo(row, deltaStr);
                            this.setTime(row, etdStr);
                            this.setDest(row, service.headsign);
                            this.setLine(row, service.route.name);

                            dom.append(row);
                        });
                    } else {
                        service.next_departures.forEach((departure) => {
                            let now = new Date(Date.now());
                            let etd = new Date(departure);

                            let uid = window.crypto.randomUUID();
                            let row = this.createRow(uid, etd.getTime());

                            if (etd < now) return;

                            let addInfoStr = "";
                            let etdStr =
                                this.format(etd.getHours()) +
                                ":" +
                                this.format(etd.getMinutes());

                            if (etd.getDate() != now.getDate()) {
                                addInfoStr =
                                    this.format(etd.getDate()) +
                                    "/" +
                                    this.format(etd.getMonth() + 1) +
                                    "/" +
                                    etd.getFullYear();
                            } else {
                                addInfoStr = "Later today";
                            }

                            this.setOper(row, service.route.brand);
                            this.setStatus(row, "Scheduled");
                            this.setAddInfo(row, addInfoStr);
                            this.setTime(row, etdStr);
                            this.setDest(row, service.headsign);
                            this.setLine(row, service.route.name);

                            dom.append(row);
                        });
                    }
                });

                dom = this.sortDOM(dom);
                this.commitDOM(dom);
            })
            .fail((error) => {
                console.error(error);
            });
    };

    throwError = (code, message) => {
        let dom = this.createDOM();
        let row = this.createRow("", "");

        this.setLine(row, "", false);
        this.setCalls(row, [{ Name: message }]);

        dom.append(row);
        this.commitDOM(dom);

        return {
            error: {
                code: code,
                message: message,
            },
        };
    };

    checkRefresh = () => {
        const date = new Date();

        if (date.getSeconds() === 0) return true;
        return false;
    };

    createRow = (uid, etd) => {
        // initialise object
        let row = this.jQuery("<div>");
        row.addClass("row");
        row.attr("data-uid", uid);
        row.attr("data-etd", etd);
        row.html(
            '<div class=\"col boardinfo\"><span class=\"due info\">&nbsp;<\/span><\/div><div class=\"col destinfo originfo\"><span class=\"dest orig\">&nbsp;<\/span><\/div><div class=\"col opinfo\"><span class=\"oper\">&nbsp;<\/span><\/div><div class=\"col lineinfo\"><span class=\"line\">&nbsp;<\/span><\/div><div class=\"col schedinfo\"><span class=\"status\">&nbsp;<\/span><span class=\"addinfo\">&nbsp;<\/span><\/div><div class=\"col callsinfo\"><ul class=\"calls\"><\/ul><\/div>',
        );

        return row;
    };

    createDOM = () => {
        return this.jQuery("<main>");
    };

    sortDOM = (dom) => {
        let rows = [];
        let sortOns = [];

        dom.children().each((idx, element) => {
            sortOns.push(this.jQuery(element).attr("data-etd"));
            sortOns.sort();
        });

        sortOns.forEach((sortOn) => {
            rows.push(dom.find("div[data-etd='" + sortOn + "']"));
        });

        return dom;
    };

    commitDOM = (dom) => {
        this.jQuery("main").remove();
        return this.jQuery("#wrapper").find("header").first().after(dom);
    };

    setAddInfo = (row, addInfo = "") => {
        return row.find("span.addinfo").first().html(addInfo);
    };

    setCalls = (row, callingPoints = []) => {
        callingPoints.forEach((callingPoint) => {
            row.find("ul.calls")
                .first()
                .append("<li>" + callingPoint.Name + "</li>");
        });

        return row.find("ul.calls").first();
    };

    setDest = (row, dest) => {
        return row.find("span.dest").first().html(dest);
    };

    setOper = (row, oper = "TFL") => {
        let tocMap = {};
        oper = tocMap[oper] || oper;

        // special logo'd operators
        if (oper == "First")
            oper =
                '<img src=\"\/res\/vectors\/firstbus.svg\" style=\"width:2.25em\" alt=\"First Bus\" \/>';
        if (oper == "West" || oper == "BristolMetrobus")
            oper =
                '<img src=\"\/res\/vectors\/westbus.svg\" style=\"width:2.25em\" alt=\"WEST Bus\" \/>';
        if (oper == "PlymouthCitybus")
            oper =
                '<img src=\"\/res\/vectors\/plymouthcitybus.svg\" style=\"width:2.25em\" alt=\"Plymouth CityBus\" \/>';
        if (oper == "TransportCornwall")
            oper =
                '<img src=\"\/res\/vectors\/transportcornwall.svg\" style=\"width:2.25em\" alt=\"Karyans rag Kernow\" \/>';
        if (oper == "Stagecoach")
            oper =
                '<img src=\"\/res\/vectors\/stagecoach.svg\" style=\"width:2.25em\" alt=\"Stagecoach\" \/>';

        return row.find("span.oper").first().html(oper);
    };

    setOrig = (row, orig) => {
        return row.find("span.orig").first().html(orig);
    };

    setLine = (row, line = "", lineChanged = false) => {
        if (lineChanged) row.find("span.line").first().addClass("alert");

        if (line == "") {
            row.find("span.line").first().remove();
            return undefined;
        }

        return row.find("span.line").first().html(line);
    };

    setSpecialNotice = (row, specialNotice) => {
        row.addClass("alert");

        return row.find("p").first().html(specialNotice);
    };

    setStatus = (row, status = "") => {
        if (status == "Due") {
            row.find("span.status").first().addClass("alert");
        } else if (status == "Scheduled") {
            row.find("span.status").first().addClass("danger");
        }

        return row.find("span.status").first().html(status);
    };

    setTime = (row, time = "") => {
        return row.find("span.due").first().html(time.replace(":", "h"));
    };

    setTitle = (stop = "") => {
        let title;

        if (this.mode == "departs") title = "Departures from " + stop;
        else if (this.mode == "arrivees") title = "Arrivals at " + stop;

        this.jQuery("title").text(title);

        return this.jQuery("header h1").first().html(title);
    };

    format = (input) => {
        if (input < 10) input = "0" + input;

        return input;
    };
};

export default Bus;
