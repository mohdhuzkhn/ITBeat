require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
require('./migrations/001_initial');