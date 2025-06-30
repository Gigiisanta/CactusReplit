import React from "react";

// Archivo de prueba con formato incorrecto intencionalmente
const TestComponent = ( ) => {
    const message="Hello World";
    const   data    = {value: 123,  name:  "test"};
    const  isVisible =    true;
    console.log( message );
    return <div className = "test"   >{ message } - {data.value} - {isVisible ? "visible" : "hidden"}</div>;
}

export default TestComponent; 