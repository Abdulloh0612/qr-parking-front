import { motion } from 'framer-motion'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{
                scale: currentStep >= step ? 1 : 0.8,
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                currentStep >= step
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {currentStep > step ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                step
              )}
            </motion.div>
            {labels && labels[index] && (
              <p
                className={`mt-2 text-xs font-medium ${
                  currentStep >= step ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {labels[index]}
              </p>
            )}
          </div>
          {index < totalSteps - 1 && (
            <div className="flex-1 h-0.5 mx-2 -mt-8 bg-gray-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: currentStep > step ? '100%' : '0%',
                }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
