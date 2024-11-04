const options = {
    root: document.querySelector(".wrapper"),
    rootMargin: "0px",
    threshold: 0.9,
};

const featuresCallback = (entries, observer) => {
    entries.forEach((entry) => {
        console.log("for each intersecting: ", entry)
        if (entry.isIntersecting) {
            let elem = entry.target;
            if (entry.intersectionRatio >= 0.90) {
                elem.classList.add("intersecting");
            }
        }
    });
};

const fadeCallback = (entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            let elem = entry.target;
    
            if (entry.intersectionRatio >= 0.9) {
            elem.classList.add("intersecting");
            }
        }
    });
};

const enrollmentCountCallback = (entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            let elem = entry.target;
    
            if (entry.intersectionRatio >= 0.50) {
            let number = 300;
            var interval = setInterval(function() {
                const target = 400;
                elem.textContent = number;
                if (number >= target) clearInterval(interval);
                number++;
            }, 10);
            }
        }
    });
};

const alCountCallback = (entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            let elem = entry.target;
    
            if (entry.intersectionRatio >= 0.50) {
            let number = 50.3;
            var interval = setInterval(function() {
                const target = 93.3;
                elem.textContent = number;
                if (number >= target) clearInterval(interval);
                number++
            }, 10);
            }
        }
    });
};

window.onload = () => {
    const featuresObserver = new IntersectionObserver(featuresCallback, options);
    const fadeObserver = new IntersectionObserver(fadeCallback, options);
    const enrollmentCountObserver = new IntersectionObserver(enrollmentCountCallback, options);
    const alCountObserver = new IntersectionObserver(alCountCallback, options);
    const enrollmentCounter = document.getElementById('enrollment-count');
    const alCounter = document.getElementById('al-count');
    const valuePropSection = document.getElementsByClassName("value-prop")[0];
    const guaranteeSection = document.getElementsByClassName("guarantee")[0];
    const features = document.getElementsByClassName("feature-img");
    for (let feature of features) {
        console.log("feature img")
        featuresObserver.observe(feature);
    }
    fadeObserver.observe(guaranteeSection);
    fadeObserver.observe(valuePropSection);
    enrollmentCountObserver.observe(enrollmentCounter);
    alCountObserver.observe(alCounter);
}
