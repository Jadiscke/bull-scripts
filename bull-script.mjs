import fetch from "node-fetch";
import { Headers } from "node-fetch";
import "dotenv/config";

const URL = process.env.URL;
const START_PAGE = Number(process.env.START_PAGE);
const END_PAGE = Number(process.env.END_PAGE);
const COOKIE = process.env.COOKIE || '';
const OPT = process.env.OPT || 'DEFAULT';

// console.log('Starting...')
// console.log('Configs: ', URL, ' / ', START_PAGE, ' - ', END_PAGE)

const headers = new Headers({
  cookie: COOKIE,
})

async function retryJobs(jobsArray) {
  await Promise.all(jobsArray.map( async (jobId)=> {
    await fetch(`${URL}/api/queues/UseCaseJob/${jobId}/retry`, {method: 'put', headers: headers})
  }))
}

async function cleanJobs(jobsArray) {
  await Promise.all(jobsArray.map( async (jobId) => {
    const result = await fetch(`${URL}/api/queues/UseCaseJob/${jobId}/clean`, {method: 'put', headers: headers})
    console.log(result.statusText)
  }))
}

async function retryAll() {
  console.log('Start Retry All')
  const result = await fetch(`${URL}/api/queues/UseCaseJob/retry`, {method: 'put', headers: headers, redirect: "follow", follow: 20})
  console.log(result)
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

async function bullScript(start, end) {
  for (let i = start; i >= end; i--) {
    if( i % 100 === 0) {
      console.log(i)
    }
  
    const response = await fetch(
      `${URL}/api/queues?activeQueue=UseCaseJob&status=failed&page=${i}`,
      { method: "get", headers: headers }
    )
  
    const jobsIds = (await response.json()).queues[0].jobs.map(element => element.id)
    retryJobs(jobsIds).catch((error) => { console.log(error.code)})
  
  }
}

export function getStartEndArray(startValue, endValue, n) {
  const startEndArray = new Array(n).fill({start:0, end: 0})
  const dividedStartValue = Number((startValue / n).toFixed(0))
  return startEndArray.map((element, index) => {
    const start = dividedStartValue * (index + 1)
    const end = endValue + dividedStartValue * index
    return {start, end}
  })
}

export async function parallelSend(startEndArray,index) {
  return bullScript(startEndArray[index].start, startEndArray[index].end)
}

export async function main(opt) {

  if (opt === 'PARALLEL') {
    const startEndArray = getStartEndArray(START_PAGE, END_PAGE, n)
    console.log(startEndArray)
    await Promise.all(startEndArray.map(async (element) => {
      bullScript(element.start, element.end)
    }))
  }

  if (opt === 'DEFAULT') {
    bullScript(START_PAGE, END_PAGE);
  }
  
}
