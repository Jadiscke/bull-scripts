import { parentPort } from 'worker_threads'
import { parallelSend } from './bull-script.mjs'

parentPort.on("message", (contents) => {
  const {index, startEndArray } = contents

  parallelSend(startEndArray, index)
  parentPort.postMessage(
    `Started: ${index}, ${startEndArray[index]}` 
  )
})