async function test() {
    try {
        const res = await fetch('http://localhost:5004/api/inventory/boxes');
        const json = await res.json();
        console.log(json);
    } catch (e) {
        console.error(e);
    }
}
test();
