declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module '*.worker' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module '*.worker.js' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

// For our specific worker
declare module 'worker-loader!../workers/meditation-timer.worker' {
  class MeditationTimerWorker extends Worker {
    constructor();
    postMessage(data: any): void;
  }
  export default MeditationTimerWorker;
}
