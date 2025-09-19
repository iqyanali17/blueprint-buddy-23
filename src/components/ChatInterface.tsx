import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Mic, 
  Camera, 
  Bot, 
  User, 
  Image,
  MessageCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm MEDITALK, your AI healthcare assistant. I can help you with symptom assessment, medical guidance, and health questions. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('headache') || lowerMessage.includes('head pain')) {
      return "I understand you're experiencing headache symptoms. Can you describe: 1) When did it start? 2) Rate the pain 1-10? 3) Any nausea or vision changes? 4) What triggers seem to make it worse? This will help me provide better guidance.";
    }
    
    if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      return "Fever can indicate various conditions. Please tell me: 1) Your current temperature? 2) How long have you had fever? 3) Any other symptoms like chills, body aches, or sore throat? 4) Have you taken any medication? I recommend monitoring your temperature and staying hydrated.";
    }
    
    if (lowerMessage.includes('cough') || lowerMessage.includes('throat')) {
      return "Throat and cough symptoms can have different causes. Please describe: 1) Is it a dry or productive cough? 2) Any throat pain or difficulty swallowing? 3) Duration of symptoms? 4) Any recent exposure to illness? Based on your answers, I can provide appropriate guidance.";
    }
    
    if (lowerMessage.includes('stomach') || lowerMessage.includes('nausea') || lowerMessage.includes('vomit')) {
      return "Digestive symptoms need careful assessment. Can you share: 1) Type of discomfort (nausea, pain, cramping)? 2) When did it start? 3) Any recent food changes? 4) Severity level 1-10? Please stay hydrated and avoid solid foods until symptoms improve.";
    }
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('severe')) {
      return "⚠️ If you're experiencing a medical emergency with severe symptoms like chest pain, difficulty breathing, severe bleeding, or loss of consciousness, please call emergency services (911) or go to the nearest emergency room immediately. I'm here for non-emergency guidance only.";
    }
    
    return "Thank you for sharing your concern. While I can provide general health information, I recommend discussing your symptoms with a healthcare professional for proper diagnosis and treatment. Is there anything specific about your symptoms you'd like me to help clarify?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: simulateBotResponse(inputMessage),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section id="chat" className="py-20 bg-gradient-healing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4 mr-2" />
            Interactive Demo
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Try MEDITALK Now
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience our AI-powered medical assistant. Ask about symptoms, get health guidance, 
            and see how MEDITALK can help with your healthcare needs.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="h-[600px] flex flex-col shadow-medical">
            {/* Chat Header */}
            <CardHeader className="border-b bg-gradient-hero text-white">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">MEDITALK AI Assistant</div>
                  <div className="text-xs text-white/80 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse-medical" />
                    Online • Ready to Help
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-muted mr-12'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="w-5 h-5 text-primary-foreground mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className="flex items-center mt-2 text-xs opacity-70">
                          <Clock className="w-3 h-3 mr-1" />
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-2xl bg-muted mr-12">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-primary" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">MEDITALK is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Describe your symptoms or ask a health question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-24"
                  />
                  
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Camera className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  variant="medical"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("I have a headache")}
                  className="text-xs"
                >
                  Headache symptoms
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("I have a fever")}
                  className="text-xs"
                >
                  Fever concerns
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Cough and sore throat")}
                  className="text-xs"
                >
                  Throat issues
                </Button>
              </div>
              
              {/* Disclaimer */}
              <div className="flex items-center mt-3 p-2 bg-warning/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-warning mr-2 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This is a demo. MEDITALK provides general health information only. 
                  Always consult healthcare professionals for medical advice.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ChatInterface;