const userLogin = {
    email: "david.duong@wpromote.com",
    password: "test",
};

const urls = {
    home: "www.google.com",
}

const pagespeedCriteria = {
    minElemHeight: 300,
    minElemWidth: 0,
    minWordCount: 300,
    minImgHeight: 20,
    minImgWidth: 20,
}

const timestamp = Date.now();

exports.userLogin = userLogin;
exports.urls = urls;
exports.timestamp = timestamp;
exports.psc = pagespeedCriteria;
