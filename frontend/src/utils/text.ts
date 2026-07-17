/**
 * Cleans and formats raw text returned from TourAPI.
 * Replaces <br> tags with newlines and removes other HTML tags/entities.
 */
export function formatTourApiText(text: string | undefined | null): string {
  if (!text) return '';
  
  let result = text;
  
  // Replace HTML-encoded <br> tags (e.g., &lt;br&gt;, &lt;br /&gt;)
  result = result.replace(/&lt;br\s*\/?&gt;/gi, '\n');
  
  // Replace actual HTML <br> tags with newlines
  result = result.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove any remaining HTML tags (e.g. <b>, <strong>, etc.)
  result = result.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Replace standard HTML entities
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
    
  return result.trim();
}
