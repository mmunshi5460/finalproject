//destructuring an object
var person = {
    name: "Tony Stark",
    phone: "123-23-2134",
    email: "tonystark@avengers.com",
    team: "avengers"
}

//Destructured the object in to 3 different variables that you can use in the program
var {name, phone, email} = person;
//Destructuring allows us to use name instead of person.name
console.log(name);