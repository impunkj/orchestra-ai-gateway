import { Router, Request, Response } from 'express';
import { aiClient, TARGET_MODEL, GATEWAY_TOOLS } from '../config/ai';
import { apiKeyGuard } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';
import { gatewayCache } from '../config/cache';
import { logger } from '../utils/logger';
import { getLiveWeather } from '../services/tools'; // Import our local tool logic

const router = Router();

router.post('/', apiKeyGuard, apiRateLimiter as any, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { prompt } = req.body;

    if (!prompt) {
      logger.warn('Incoming request rejected: Missing prompt payload data.');
      res.status(400).json({ error: 'Prompt payload is mandatory.' });
      return;
    }

    const cacheKey = `query:${prompt.trim().toLowerCase()}`;
    const cachedResponse = gatewayCache.get<string>(cacheKey);

    if (cachedResponse) {
      const duration = Date.now() - startTime;
      logger.info(`⚡ [CACHE HIT] Resolved instantly from memory in ${duration}ms`);
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      res.write(`data: ${JSON.stringify({ token: cachedResponse })}\n\n`);
      res.end();
      return;
    }

    logger.info(`🌐 [CACHE MISS] Routing prompt out to Groq Cloud with functional tools capabilities...`);

    // 1. Initial Evaluation Call to Groq with Tools enabled
    const initialResponse = await aiClient.chat.completions.create({
      model: TARGET_MODEL,
      messages: [{ role: 'user', content: prompt }],
      tools: GATEWAY_TOOLS, // Give the AI access to our system blueprints
      tool_choice: 'auto',
    });

    const choice = initialResponse.choices[0];
    const wantToCallTool = choice.message?.tool_calls;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // CASE A: The AI decided it needs to execute our system tools
    if (wantToCallTool) {
      const toolCall = wantToCallTool[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      logger.info(`[AI DECISION] Model requested execution of local tool: "${functionName}" with parameters: ${JSON.stringify(functionArgs)}`);

      let toolResultPayload = {};

      if (functionName === 'getLiveWeather') {
        // Execute our native TypeScript service function safely
        toolResultPayload = await getLiveWeather(functionArgs.location);
      }

      logger.info(` [TOOL EXECUTION] Local execution complete. Result data captured: ${JSON.stringify(toolResultPayload)}`);

      // Send the tool results back to Groq so it can format the final answer for the user
      // Send the tool results back to Groq with an added System Guard Persona
      const finalStream = await aiClient.chat.completions.create({
        model: TARGET_MODEL,
        messages: [
          //  Inject a System Persona telling the model how to behave with tool data
          { 
            role: 'system', 
            content: 'You are a live system integration core. When presenting data returned by tools, state the metrics directly as real-time ground truth. Never mention knowledge cutoffs, simulations, or AI limitations.' 
          },
          { role: 'user', content: prompt },
          choice.message, 
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResultPayload), 
          },
        ],
        stream: true, 
      });

      let completeAccumulatedText = '';
      for await (const chunk of finalStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          completeAccumulatedText += content;
          res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
        }
      }

      if (completeAccumulatedText) {
        gatewayCache.set(cacheKey, completeAccumulatedText);
      }

    // CASE B: Standard text generation query (No tools required)
    } else {
      logger.info(` [STANDARD ROUTE] No tools required. Initiating direct streaming layout...`);
      
      // Fallback to streaming directly since no tools were invoked
      const fallbackStream = await aiClient.chat.completions.create({
        model: TARGET_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let completeAccumulatedText = '';
      for await (const chunk of fallbackStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          completeAccumulatedText += content;
          res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
        }
      }

      if (completeAccumulatedText) {
        gatewayCache.set(cacheKey, completeAccumulatedText);
      }
    }

    const totalDuration = Date.now() - startTime;
    logger.info(` [PIPELINE SUCCESS] Request successfully fulfilled in ${totalDuration}ms`);
    res.end();

  } catch (error) {
    logger.error(` [GATEWAY STREAM ERROR]: ${error instanceof Error ? error.message : String(error)}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal streaming pipeline breakdown.' });
    }
  }
});

export default router;