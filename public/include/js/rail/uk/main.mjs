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
    constructor(config = Object()) {
        this.mode = config.mode;
        this.tiplocId = config.tiplocId;
        this.api = config.api;
        this.jQuery = config.jquery;

        this.hideCalls = config.hideCalls || false;

        if (this.mode == undefined) {
            return this._throwError(
                "no_mode",
                "No mode was specified for this class"
            );
        }
    }

    init = () => {
        this.build()
            .then(() => {
                this.setTitle(this.name || this.tiplocId || "");
            })
            .then(() => {
                this.jQuery("div#loading").remove();
            })
            .catch(error => {
                console.error(error);
            });

        return;
    };

    build = async () => {
        return this.fetchServices()
            .then(() => {
                return this.createDOM();
            })
            .then(dom => {
                if (this.error) {
                    return this._throwError(this.error.code, this.error.error);
                }

                if (this.services == undefined || this.services.length < 1) {
                    return this._throwError(
                        "NoData",
                        "There is currently no train information available."
                    );
                }

                if (this.incidentSummary != "") {
                    this.setIncidentSummary(
                        this.jQuery("footer"),
                        this.incidentSummary,
                        true
                    );
                } else if (this.specialNotice != "") {
                    this.setSpecialNotice(
                        this.jQuery("footer"),
                        this.specialNotice,
                        true
                    );
                } else {
                    this.setIncidentSummary(this.jQuery("footer"), "", false);
                    this.setSpecialNotice(this.jQuery("footer"), "", false);
                }

                this.services.forEach((service, idx) => {
                    if (this.mode == "departs" && service.STD == "") {
                        return;
                    }
                    if (this.mode == "arrivees" && service.STA == "") {
                        return;
                    }

                    let uid = service.UID;
                    let row = this.createRow(uid, service.ETA, service.ETD);

                    this.setOper(row, service.ATOCCode);
                    this.setHeadCode(row, service.Headcode);
                    this.setPlatform(
                        row,
                        service.Platform,
                        service.PlatformChanged
                    );
                    this.setStatus(
                        row,
                        service.STD,
                        service.ETD,
                        service.Delay
                    );
                    this.setAddInfo(
                        row,
                        service.STD,
                        service.ETD,
                        service.Delay
                    );
                    this.setCoaches(
                        row,
                        service.Destinations?.Front?.Coaches || null
                    );

                    if (this.mode == "departs") {
                        this.setTime(row, service.STD);
                        this.setDest(row, service.Destinations.Front.Name);

                        if (
                            idx < 2 &&
                            !this.hideCalls &&
                            service.CallingPoints
                        ) {
                            this.setCalls(row, service.CallingPoints.Front);
                        }
                    }
                    if (this.mode == "arrivees") {
                        this.setTime(row, service.STA);
                        this.setOrig(row, service.Origins.Front.Name);
                    }

                    dom.append(row);
                });

                this.commitDOM(dom);
            })
            .catch(error => {
                return this._throwError(error);
            });
    };

    fetchServices = async () => {
        return this.api
            .getServices(this.tiplocId)
            .done(data => {
                if (data.detail && data.name) {
                    return (this.error = {
                        code: data.name,
                        error: data.detail,
                    });
                }

                this.crs = data.CRS;
                this.incidentSummary = data.incidentSummary;
                this.name = data.Name;
                this.services = data.services;
                this.specialNotice = data.specialNotice;
                this.specialNoticeType = data.specialNoticeType;
            })
            .fail(error => {
                return this._throwError(error);
            });
    };

    checkRefresh = () => {
        const date = new Date();

        if (date.getSeconds() === 0) {
            return true;
        } else {
            return false;
        }
    };

    commitDOM = dom => {
        this.jQuery("main").remove();
        return this.jQuery("#wrapper").find("header").first().after(dom);
    };

    createDOM = () => {
        return this.jQuery("<main>");
    };

    createRow = (uid, eta, etd) => {
        // initialise object
        let row = this.jQuery("<div>");
        row.addClass("row");
        row.attr("data-uid", uid);
        row.attr("data-eta", eta);
        row.attr("data-etd", etd);
        row.html(
            '<div class=\"col boardinfo\"><span class=\"due info\">&nbsp;<\/span><\/div><div class=\"col destinfo originfo\"><span class=\"dest orig\">&nbsp;<\/span><\/div><div class=\"col opinfo\"><span class=\"oper\">&nbsp;<\/span><span class=\"headcode\">&nbsp;<\/span><\/div><div class=\"col platinfo\"><span class=\"platform\">&nbsp;<\/span><\/div><div class=\"col schedinfo\"><span class=\"status\">&nbsp;<\/span><span class=\"addinfo\"><\/span><span class=\"coaches\"><\/span><\/div><div class=\"col break-flex\"><\/div><div class=\"col callsinfo\"><ul class=\"calls\"><\/ul><\/div>'
        );

        return row;
    };

    setAddInfo = (row, STD = "", ETD = "", delay = "") => {
        let value;
        delay = Number(delay.replace("+", ""));

        if (ETD == "On time" || STD == ETD) {
            value = "On time";
        } else if (delay === "CAN") {
            value = "Cancelled";
        } else {
            value = "Delayed";
        }

        if (value == "On time") {
            return;
        }
        if (isNaN(delay)) {
            return;
        }

        return row
            .find("span.addinfo")
            .first()
            .addClass("alert")
            .html(delay + " minutes");
    };

    setCalls = (row, callingPoints = []) => {
        callingPoints.forEach(callingPoint => {
            row.find("ul.calls")
                .first()
                .append("<li>" + callingPoint.Name + "</li>")
                .addClass("animated");
        });

        return row.find("ul.calls").first();
    };

    setCoaches = (row, coaches = null) => {
        if (coaches == null || isNaN(coaches)) {
            return;
        }

        return row
            .find("span.coaches")
            .first()
            .html(coaches + " coaches");
    }

    setDest = (row, dest) => {
        return row.find("span.dest").first().html(dest);
    };

    setHeadCode = (row, headcode = "") => {
        return row.find("span.headcode").first().html(headcode);
    };

    setIncidentSummary = (row, incidentSummary = "", isActive = false) => {
        if (isActive) {
            row.addClass("alert");
            row.css("display", "block");
        } else {
            row.removeClass("alert");
            row.css("display", "none");
        }

        return row.find("p").first().html(incidentSummary);
    };

    setOper = (row, oper = "GB") => {
        let tocMap = {
            AW: "TfW",
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
        if (oper == "GWR") {
            oper =
                '<img src=\"\/res\/vectors\/rail\/gwr.svg\" style=\"width:2.25em\" alt=\"GWR\" \/>';
        }
        if (oper == "SR") {
            oper =
                '<img src=\"\/res\/vectors\/rail\/scot.svg\" style=\"width:2.25em\" alt=\"ScotRail\" \/>';
        }
        if (oper == "TfL") {
            oper =
                '<img src=\"\/res\/vectors\/rail\/tfl.svg\" style=\"width:2.25em\" alt=\"TfL\" \/>';
        }
        if (oper == "TfW") {
            oper =
                '<img src=\"\/res\/vectors\/rail\/tfw.svg\" style=\"width:2.25em\" alt=\"TfW\" \/>';
        }

        return row.find("span.oper").first().html(oper);
    };

    setOrig = (row, orig) => {
        return row.find("span.orig").first().html(orig);
    };

    setPlatform = (row, platform = "", platformChanged = false) => {
        if (platformChanged) {
            row.find("span.platform").first().addClass("alert");
        }
        if (platform == "") {
            row.find("span.platform").first().remove();
            return undefined;
        }

        return row.find("span.platform").first().html(platform);
    };

    setSpecialNotice = (row, specialNotice = "", isActive = false) => {
        if (isActive) {
            row.addClass("alert");
            row.css("display", "block");
        } else {
            row.removeClass("alert");
            row.css("display", "none");
        }

        return row.find("p").first().html(specialNotice);
    };

    setStatus = (row, STD = "", ETD = "", delay = "") => {
        let value;

        if (ETD == "On time" || STD == ETD) {
            value = "On time";
        } else if (delay === "CAN") {
            value = "Cancelled";
            row.find("span.coaches").first().css("display", "none");
        } else {
            value = "Delayed";
        }

        if (value == "Delayed" || value == "Cancelled") {
            row.find("span.status").first().addClass("alert");
        }

        return row.find("span.status").first().html(value);
    };

    setTime = (row, time = "") => {
        return row.find("span.due").first().html(time.replace(":", "h"));
    };

    setTitle = (name = "") => {
        let title;

        if (this.mode == "departs") {
            title = "Departures from " + name;
        } else if (this.mode == "arrivees") {
            title = "Arrivals at " + name;
        }

        this.jQuery("title").text(title);
        return this.jQuery("header h1").first().html(title);
    };

    _throwError = (code, error) => {
        let dom = this.createDOM();
        let row = this.createRow("", "");

        this.setPlatform(row, "", false);
        this.setCalls(row, [{ Name: error }]);

        dom.append(row);
        this.commitDOM(dom);

        return console.error({
            code: code,
            error: error,
        });
    };

    _toTitleCase = input => {
        return input.replace(
            /\w\S*/g,
            text =>
                text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
        );
    };
};

export default UKRail;
