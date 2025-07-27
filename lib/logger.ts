// Environment-based logging utility
// This replaces console.log, console.warn, console.error with environment-aware logging

export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args)
  }
}

// For production logging service integration
export const logToService = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service like Sentry, LogRocket, etc.
    // fetch('/api/log', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ level, message, data, timestamp: new Date().toISOString() }) 
    // })
  } else {
    console[level](message, data)
  }
} 