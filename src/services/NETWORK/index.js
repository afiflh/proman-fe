import env from "../../utils/env";


const GET = async (url = 'https://cxt.co.id:5003', payload = {}) => {
    const { VITE_URL } = env
    try {
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }

        const apiResult = await fetch(`${VITE_URL}/${url}`, options)
        const dataResult = await apiResult.json()
        return dataResult
    } catch (error) {
        console.log(`error get data from ${url} : ${error.message}`);
        return Promise.reject(error)

    }
}

const MUTATE = async (dataPayload) => {
    const { VITE_URL } = env
    const { url, method, payload, token } = dataPayload

    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        };

        console.log(`url: ${url} method : ${method} payload : ${payload} , token : ${token}`);



        const apiResult = await fetch(`${VITE_URL}/${url}`, options);

        const dataResult = await apiResult.json();
        console.log('result MUTATE', dataResult);

        return dataResult
    } catch (error) {
        console.log(`error get data from ${url} : ${error.message}`);
    }
}


export {
    GET,
    MUTATE
}