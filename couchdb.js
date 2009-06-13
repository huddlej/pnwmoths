var views = {
    "_id": "_design/moths",
    "_rev": "1337529940",
    "language": "javascript",
    "views": {
        "by_elevation": {
            "map": "function(doc) {\n if (doc.elevation) {\n emit(doc.elevation, doc);\n }\n}"
        },
        "by_collector": {
            "map": "function(doc) {\n if (doc.collector) {\n emit(doc.collector, doc);\n }\n}"
        },
        "by_species": {
            "map": "function(doc) {\n if(doc.elevation) {\n doc.elevation = parseInt(doc.elevation);\n }\n else {\n doc.elevation = \"\";\n }\n\n doc.site_name = doc.city;\n emit(doc.genus + \" \" + doc.species, doc);\n}"
        },
        "unique_species": {
            "map": "function(doc) {\n emit(doc.genus + \" \" + doc.species, doc);\n}",
            "reduce": "function(keys, values) {\n return null;\n}"
        },
        "by_coordinates": {
            "map": "function(doc) {\n emit([doc.genus + \" \" + doc.species, [doc.latitude, doc.longitude]], doc);\n}",
            "reduce": "function(keys, values) {\n var results = [];\n for(index in values) {\n var doc = values[index];\n var result = \"\";\n if (doc.year && doc.month && doc.day) {\n result = doc.month + \"/\" + doc.day + \"/\" + doc.year;\n }\n else if(doc.year && doc.month) {\n result = doc.month + \"/\" + doc.year;\n }\n else {\n result = doc.year;\n }\n\n if (result) {\n if (doc.collector) {\n result += \" by \" + doc.collector;\n\n if (doc.number_of_males) {\n\t result += \", \" + doc.number_of_males + \" males\";\n }\n\n if (doc.number_of_females) {\n result += \", \" + doc.number_of_females + \" females\";\n }\n\n if (doc.collection) {\n result += \" (\" + doc.collection + \")\";\n }\n }\n results.push(result);\n }\n }\n\n return results;\n}"
        }
    }
};