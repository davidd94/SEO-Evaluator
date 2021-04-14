const userLogin = {
    email: "david.duong@wpromote.com",
    password: "test",
};

const urls = {
    home: "www.google.com",
}

const pagespeedCriteria = {
    children: {
        img: {
            tag: 'img',
            minImgHeight: 20,
            minImgWidth: 20,
            minAmt: 3,
        },
        video: {
            tag: 'video',
            minAmt: 3,
        }
    },
    text: {
        // minElemHeight: 300,
        // minElemWidth: 0,
        minWordCount: 300,
    },
    video: {
        
    },
    image: {
        minImgHeight: 20,
        minImgWidth: 20,
    },
    iframe: {

    },
    link: {
        rel: ['dns-prefetch', 'preconnect', 'preload'],
        files: [
            'css',
            // 'png', 'jpeg', 'jpg',
        ],
    },
    nav: {
        minChildren: 3,
    },
    ul: {
        classes: ['nav'],
        minChildren: 3,
    },
    footer: {
        minChildren: 3,
    },
}

const timestamp = Date.now();

exports.userLogin = userLogin;
exports.urls = urls;
exports.timestamp = timestamp;
exports.psc = pagespeedCriteria;
