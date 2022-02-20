function extractCourses(category) {
    var courses = { };
    category.runners.forEach(function(runner) {
        const course = runner.splits.map(function(split, index, splits) {
            return split.code;
        });
        const key = 'St-' + course.join('-');
        if (!courses[key]) {
            courses[key] = {
                runners: [],
                controls: course.map(function(c) { 
                    return { code: c };
                })
            };
        }
        courses[key].runners.push(runner);
    });
    const coursesArray = Object.keys(courses).map(function(course) {
        return courses[course];
    });

    for (var i = 0; i < coursesArray[0].controls.length; i++) {
        const base = coursesArray[0].controls[i].code;
        const shared = coursesArray.every(function(course) {
            return course.controls[i].code === base;
        });
        coursesArray.forEach(function(course) {
            course.controls[i].shared = shared;
        });
    }

    return coursesArray;
};

module.exports.extractCourses = extractCourses;

/**
 * A category is classified as "fair" if all the runners have the exact same legs, although
 * potentially in different order.
 */
module.exports.isFair = function(category) {
    const courses = extractCourses(category);
    const courseLegs = courses.map(function(course) {
        const legs = [];
        for (var i = 0; i < course.controls.length - 1; i++) {
            const from = course.controls[i].code;
            const to = course.controls[i + 1].code;
            legs.push(from + '-' + to);
        }
        return legs.sort().join(':');
    });

    const grouped = { };
    courseLegs.forEach(function(course) {
        grouped[course] = true;
    });

    return Object.keys(grouped).length === 1;
};
