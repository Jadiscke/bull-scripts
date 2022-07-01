import fetch from "node-fetch";
import { Headers } from "node-fetch";
import "dotenv/config";

const URL = process.env.URL;
const START_PAGE = Number(process.env.START_PAGE);
const END_PAGE = Number(process.env.END_PAGE);
const COOKIE = process.env.COOKIE || '';

console.log('Starting...')
console.log('Configs: ', URL, ' / ', START_PAGE, ' - ', END_PAGE)

const headers = new Headers({
  cookie: COOKIE
})

async function retryJobs(jobsArray) {
  await Promise.all(jobsArray.map( async (jobId)=> {
    await fetch(`${URL}/api/queues/UseCaseJob/${jobId}/retry`, {method: 'put', headers: headers})
  }))
}

async function wait(waitingTime) {
  await new Promise((resolve, reject) => {
    if ( waitingTime < 0 ){
      reject('waitingTime is not a valid Value')
    }
    console.log('waiting for ', waitingTime/1000, ' seconds')
    setTimeout(resolve, waitingTime)

  })
}
process.on('uncaughtException', function (exception) {
  console.log(exception)
 });


for (let i = START_PAGE; i >= END_PAGE; i--) {
  if( i % 100 === 0) {
    console.log(i)
  }

  const response = await fetch(
    `${URL}/api/queues?activeQueue=UseCaseJob&status=failed&page=${i}`,
    { method: "get", headers: headers }
  )

  const jobsIds = (await response.json()).queues[0].jobs.map(element => element.id)
  retryJobs(jobsIds).catch((error) => { console.log(error)})

}
