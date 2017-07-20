import h from 'handlebars-helpers';

const helpers = h();

export default function(str, pattern) {
    return helpers(str, pattern)
}
