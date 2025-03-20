/**
 * Interface for AI services that can be used by the ThinkingServiceImpl
 * This allows different AI service implementations to be used interchangeably
 */

export interface IAIService {
  /**
   * Query the AI service with data
   * @param data The data to send to the AI service
   * @returns The response from the AI service
   */
  query(data: any): Promise<any>;
}