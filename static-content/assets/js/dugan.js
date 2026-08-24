import bcrypt from "bcryptjs";

function checkPassword() {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync("RainsDownInAfrica", salt);

    console.log(`Password ${hash}`)

    const correctHash = "$2b$10$y/0nrKpP5u5RKk4SbdXxAOeCmKLZIrrFvNnub9rvMLkSp.FhEsZNW";
    const userValue = document.getElementById("rsvp-passwd").value;
    if (bcrypt.compareSync(userValue, correctHash)) {
        document.getElementById("rsvp-form").style.display = "block";
        document.getElementById("unlock-rsvp").style.display = "none";
    } else {
        alert("Wrong Password")
    }

}
document.getElementById("rsvp-passwd-btn").addEventListener('click', checkPassword);
