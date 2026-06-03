import { logger } from '../utils/logger';

/**
 * A native TypeScript tool that the gateway can execute 
 * when the AI requests real-time environmental data context.
 */
export const getLiveWeather = async (location: string): Promise<{ temperature: string; condition: string; humidity: string; updated: string }> => {
  logger.info(`🔌 [Tool Service Executing]: Fetching live telemetry metrics for target: "${location}"`);

  const normalizedLocation = location.toLowerCase();
  
  // Simulated database or external API (e.g., OpenWeatherMap) response matrix
  if (normalizedLocation.includes('delhi')) {
    return { 
      temperature: "42°C", 
      condition: "Sunny/Heatwave", 
      humidity: "42%", 
      updated: new Date().toLocaleTimeString() 
    };
  }
  
  if (normalizedLocation.includes('london')) {
    return { 
      temperature: "14°C", 
      condition: "Light Drizzle", 
      humidity: "85%", 
      updated: new Date().toLocaleTimeString() 
    };
  }

  // Fallback metrics payload structure
  return { 
    temperature: "22°C", 
    condition: "Clear Sky", 
    humidity: "55%", 
    updated: new Date().toLocaleTimeString() 
  };
};