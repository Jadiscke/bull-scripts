import { Worker } from 'worker_threads'
import { getStartEndArray } from './bull-script.mjs'
const START_PAGE = Number(process.env.START_PAGE);
const END_PAGE = Number(process.env.END_PAGE);
const n = 100
const startEndArray = getStartEndArray(START_PAGE,END_PAGE, n);
const array = new Array(n).fill(0);
const workerArray = array.map(() => new Worker('./bull-worker.mjs'))
workerArray.map((worker,index) => worker.postMessage({index, startEndArray}))
workerArray.map((worker) => worker.on('message', (result) => {
  console.log('Sent By Worker: ', result)
}))
