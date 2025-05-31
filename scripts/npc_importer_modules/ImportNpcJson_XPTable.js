var ImportNpcJson_XPTable = {
    table: {
        // CR: [XP, ProfBonus, AC, HP_Min, HP_Max, AttackBonus, DmgRound_Min, DmgRound_Max, SaveDC]
        "0":    [10,    2, 13, 1,   6,   3, 0,  1,  13],
        "1/8":  [25,    2, 13, 7,   35,  3, 2,  3,  13],
        "1/4":  [50,    2, 13, 36,  49,  3, 4,  5,  13],
        "1/2":  [100,   2, 13, 50,  70,  3, 6,  8,  13],
        "1":    [200,   2, 13, 71,  85,  3, 9,  14, 13],
        "2":    [450,   2, 13, 86,  100, 3, 15, 20, 13],
        "3":    [700,   2, 13, 101, 115, 4, 21, 26, 13],
        "4":    [1100,  2, 14, 116, 130, 5, 27, 32, 14],
        "5":    [1800,  3, 15, 131, 145, 6, 33, 38, 15],
        "6":    [2300,  3, 15, 146, 160, 6, 39, 44, 15],
        "7":    [2900,  3, 15, 161, 175, 6, 45, 50, 15],
        "8":    [3900,  3, 16, 176, 190, 7, 51, 56, 16],
        "9":    [5000,  4, 16, 191, 205, 7, 57, 62, 16],
        "10":   [5900,  4, 17, 206, 220, 7, 63, 68, 16],
        "11":   [7200,  4, 17, 221, 235, 8, 69, 74, 17],
        "12":   [8400,  4, 17, 236, 250, 8, 75, 80, 17],
        "13":   [10000, 5, 18, 251, 265, 8, 81, 86, 18],
        "14":   [11500, 5, 18, 266, 280, 8, 87, 92, 18],
        "15":   [13000, 5, 18, 281, 295, 8, 93, 98, 18],
        "16":   [15000, 5, 18, 296, 310, 9, 99, 104,18],
        "17":   [18000, 6, 19, 311, 325, 10,105,110,19],
        "18":   [20000, 6, 19, 326, 340, 10,111,116,19],
        "19":   [22000, 6, 19, 341, 355, 10,117,122,19],
        "20":   [25000, 6, 19, 356, 400, 10,123,140,19],
        "21":   [33000, 7, 19, 401, 445, 11,141,158,20],
        "22":   [41000, 7, 19, 446, 490, 11,159,176,20],
        "23":   [50000, 7, 19, 491, 535, 11,177,194,20],
        "24":   [62000, 7, 19, 536, 580, 12,195,212,21],
        "25":   [75000, 8, 19, 581, 625, 12,213,230,21],
        "26":   [90000, 8, 19, 626, 670, 12,231,248,21],
        "27":   [105000,8, 19, 671, 715, 13,249,266,22],
        "28":   [120000,8, 19, 716, 760, 13,267,284,22],
        "29":   [135000,9, 19, 760, 805, 13,285,302,22],
        "30":   [155000,9, 19, 805, 850, 14,303,320,23]
    },
    getXP: function(cr) {
        const crString = String(cr);
        const stats = this.getCRBenchmarkStats(crString);
        return stats ? stats.xp : null;
    },
    getCRBenchmarkStats: function(cr) {
        const crString = String(cr);
        let rowData = null;

        if (this.table.hasOwnProperty(crString)) {
            rowData = this.table[crString];
        } else if (crString === "0.125") {
            rowData = this.table["1/8"];
        } else if (crString === "0.25") {
            rowData = this.table["1/4"];
        } else if (crString === "0.5") {
            rowData = this.table["1/2"];
        }

        if (!rowData) return null;

        return {
            cr: crString,
            xp: rowData[0],
            profBonus: rowData[1],
            ac: rowData[2],
            hpMin: rowData[3],
            hpMax: rowData[4],
            attackBonus: rowData[5],
            dmgRoundMin: rowData[6],
            dmgRoundMax: rowData[7],
            saveDC: rowData[8]
        };
    }
};

// Log that the module is loaded (assuming ImportJSON_Utils and its dbg function are available globally when this runs)
// This might need to be called from a central loading script that ensures order.
// For now, let's assume it can be logged if ImportJSON_Utils is already set up.
if (typeof ImportJSON_Utils !== 'undefined' && typeof ImportJSON_Utils.dbg === 'function') {
    ImportJSON_Utils.dbg("ImportNpcJson_XPTable.js (extended) populated and loaded.");
} else {
    // Fallback log if utils isn't ready (e.g. during script startup order)
    // log("ImportNpcJson_XPTable.js loaded (Utils not yet available for dbg).");
} 