// Environment-based logging utility
// This replaces logger.log, logger.warn, logger.error with environment-aware logging

export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      // Use a simple approach that works in both browser and Node.js
      try {
        if (typeof window !== 'undefined') {
          // Browser environment
          window.console.log(...args)
        } else {
          // Node.js environment
          process.stdout.write(args.join(' ') + '\n')
        }
      } catch (error) {
        // Fallback to process.stdout if available
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write(args.join(' ') + '\n')
        }
      }
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        if (typeof window !== 'undefined') {
          window.console.warn(...args)
        } else {
          process.stderr.write('WARN: ' + args.join(' ') + '\n')
        }
      } catch (error) {
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write('WARN: ' + args.join(' ') + '\n')
        }
      }
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    try {
      if (typeof window !== 'undefined') {
        window.console.error(...args)
      } else {
        process.stderr.write('ERROR: ' + args.join(' ') + '\n')
      }
    } catch (error) {
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write('ERROR: ' + args.join(' ') + '\n')
      }
    }
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
    if (level === 'info') {
      logger.log(message, data)
    } else if (level === 'warn') {
      logger.warn(message, data)
    } else if (level === 'error') {
      logger.error(message, data)
    }
  }
} 