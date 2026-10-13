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

const UKRail = class {
    constructor(config) {
        this.mode = config.mode;
        this.tiplocId = config.tiplocId;
        this.api = config.api;
        this.jQuery = config.jquery;

        this.hideCalls = config.hideCalls || false;

        if (this.mode == undefined)
            return this.throwError(
                "no_mode",
                "No mode was specified for this object.",
            );
    }

    init = () => {
        this.api
            .getLocations()
            .done((data) => {
                this.locations = data;
                this.errors = data.errors;
            })
            .then(() => {
                this.location = this.locations.find((location) => {
                    return location.TIPLOC == this.tiplocId;
                });

                this.setTitle(this.location.Name || this.location.TIPLOC || "");
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
            .getServices(this.tiplocId)
            .done((data) => {
                this.detail = data.detail;
                this.incidentSummary = data.incidentSummary;
                this.services = data.services;
                this.specialNotice = data.specialNotice;
                this.errors = data.errors;
            })
            .then(() => {
                let dom = this.createDOM();

                if (this.detail)
                    if (
                        this.detail.includes("Location with TIPLOC") &&
                        this.detail.includes("not found")
                    ) {
                        return this.throwError("no_tiploc", this.detail);
                    }

                if (this.services == undefined || this.services.length < 1)
                    return this.throwError(
                        "no_data",
                        "There is currently no train information available.",
                    );

                if (this.specialNotice != "")
                    this.setSpecialNotice(
                        this.jQuery("footer"),
                        this.specialNotice,
                    );

                if (this.incidentSummary != "")
                    this.setIncidentSummary(
                        this.jQuery("footer"),
                        this.incidentSummary,
                    );

                this.services.forEach((service, idx) => {
                    if (this.mode == "departs" && service.STD == "") return;

                    if (this.mode == "arrivees" && service.STA == "") return;

                    let uid = service.UID;
                    let row = this.createRow(uid, service.ETA, service.ETD);

                    this.setOper(row, service.ATOCCode);
                    this.setHeadCode(row, service.Headcode);
                    this.setStatus(
                        row,
                        service.STD,
                        service.ETD,
                        service.Delay,
                    );
                    this.setAddInfo(
                        row,
                        service.STD,
                        service.ETD,
                        service.Delay,
                    );
                    this.setPlatform(
                        row,
                        service.Platform,
                        service.PlatformChanged,
                    );

                    if (this.mode == "departs") {
                        this.setTime(row, service.STD);
                        this.setDest(row, service.Destinations.Front.Name);

                        if (idx < 2 && !this.hideCalls && service.CallingPoints)
                            this.setCalls(
                                row,
                                service.CallingPoints.Front,
                            );
                    }

                    if (this.mode == "arrivees") {
                        this.setTime(row, service.STA);
                        this.setOrig(row, service.Origins.Front.Name);
                    }

                    dom.append(row);
                });

                this.commitDOM(dom);
            })
            .fail((error) => {
                console.error(error);
            });
    };

    throwError = (code, message) => {
        let dom = this.createDOM();
        let row = this.createRow("", "");

        this.setPlatform(row, "", false);
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

    fetchServices = async () => {
        return this.api
            .getServices()
            .done((data) => {
                this.services = data.services || undefined;
            })
            .fail((error) => {
                console.error(error);
            });
    };

    checkRefresh = () => {
        const date = new Date();

        if (date.getSeconds() === 0) return true;
        return false;
    };

    createRow = (uid, eta, etd) => {
        // initialise object
        let row = this.jQuery("<div>");
        row.addClass("row");
        row.attr("data-uid", uid);
        row.attr("data-eta", eta);
        row.attr("data-etd", etd);
        row.html(
            '<div class=\"col opinfo\"><span class=\"oper\">&nbsp;<\/span><span class=\"headcode\">&nbsp;<\/span><\/div><div class=\"col schedinfo\"><span class=\"status\">&nbsp;<\/span><span class=\"addinfo\">&nbsp;<\/span><\/div><div class=\"col boardinfo\"><span class=\"due alert\">&nbsp;<\/span><\/div><div class=\"col destinfo originfo\"><span class=\"dest orig\">&nbsp;<\/span><\/div><div class=\"col platinfo\"><span class=\"platform\">&nbsp;<\/span><\/div><div class=\"col callsinfo\"><ul class=\"calls\"><\/ul><\/div>',
        );

        return row;
    };

    createDOM = () => {
        return this.jQuery("<main>");
    };

    commitDOM = (dom) => {
        this.jQuery("main").remove();
        return this.jQuery("#wrapper").find("header").first().after(dom);
    };

    setAddInfo = (row, STD = "", ETD = "", delay = "") => {
        let value = "Delayed";
        delay = Number(delay.replace("+", ""));

        if (STD == ETD || ETD == "On time") value = "On time";
        if (delay === "CAN") value = "Cancelled";

        if (value == "On time") return;
        if (isNaN(delay)) return;

        return row
            .find("span.addinfo")
            .first()
            .addClass("alert")
            .html(delay + " minutes");
    };

    setCalls = (row, callingPoints = []) => {
        callingPoints.forEach((callingPoint) => {
            row.find("ul.calls")
                .first()
                .append("<li>" + callingPoint.Name + "</li>")
                .addClass("animated");;
        });

        return row.find("ul.calls").first();
    };

    setDest = (row, dest) => {
        return row.find("span.dest").first().html(dest);
    };

    setHeadCode = (row, headcode = "") => {
        return row.find("span.headcode").first().html(headcode);
    };

    setIncidentSummary = (row, incidentSummary) => {
        row.addClass("danger");

        return row.find("p").first().html(incidentSummary);
    };

    setOper = (row, oper = "GB") => {
        let tocMap = {
            EM: "EMR",
            GB: "GBR",
            GC: "GC",
            GN: "GN",
            GR: "LNER",
            GW: "GWR",
            GX: "GWX",
            HT: "HT",
            HX: "HRX",
            LD: "Lumo",
            LE: "GA",
            LM: "LNW",
            LO: "TfL",
            NI: "TLNI",
            NT: "NT",
            SN: "SN",
            SE: "SE",
            SR: "SR",
            SW: "SWR",
            TL: "TL",
            TP: "TPE",
            VT: "AWC",
            XC: "XC",
            XR: "TfL",
        };
        oper = tocMap[oper] || oper;

        // special logo'd operators
        if (oper == "GWR")
            oper =
                '<img src=\"\/res\/vectors\/gwr.svg\" style=\"width:2.25em\" alt=\"GWR\" \/>';
        if (oper == "SR")
            oper =
                '<img src=\"\/res\/vectors\/scot.svg\" style=\"width:2.25em\" alt=\"ScotRail\" \/>';
        if (oper == "TfL")
            oper =
                '<img src=\"\/res\/vectors\/tfl.svg\" style=\"width:2.25em\" alt=\"TfL\" \/>';

        return row.find("span.oper").first().html(oper);
    };

    setOrig = (row, orig) => {
        return row.find("span.orig").first().html(orig);
    };

    setPlatform = (row, platform = "", platformChanged = false) => {
        if (platformChanged)
            row.find("span.platform").first().addClass("alert");

        if (platform == "") {
            row.find("span.platform").first().remove();
            return undefined;
        }

        return row.find("span.platform").first().html(platform);
    };

    setSpecialNotice = (row, specialNotice) => {
        row.addClass("alert");

        return row.find("p").first().html(specialNotice);
    };

    setStatus = (row, STD = "", ETD = "", delay = "") => {
        let value = "Delayed";

        if (STD == ETD || ETD == "On time") value = "On time";
        if (delay === "CAN") value = "Cancelled";

        if (value == "Delayed")
            row.find("span.status").first().addClass("alert");
        else if (value == "Cancelled")
            row.find("span.status").first().addClass("danger");

        return row.find("span.status").first().html(value);
    };

    setTime = (row, time = "") => {
        return row.find("span.due").first().html(time.replace(":", "h"));
    };

    setTitle = (station = "") => {
        let title;

        if (this.mode == "departs") title = "Departures from " + station;
        else if (this.mode == "arrivees") title = "Arrivals at " + station;

        this.jQuery("title").text(title);

        return this.jQuery("header h1").first().html(title);
    };

    format = (input) => {
        if (input < 10) input = "0" + input;

        return input;
    };
};

export default UKRail;
