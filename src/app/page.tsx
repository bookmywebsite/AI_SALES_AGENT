import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Mail, Phone, BarChart3, Calendar, Shield, ArrowRight, CheckCircle, MessageCircle, MessageCirclePlus, SquareKanbanIcon, Workflow } from 'lucide-react';
import { Agent } from 'http';
// import { LandingChat } from '@/components/chat/LandingChat';

export default function HomePage() {
  const features = [
    { icon: MessageCirclePlus, title: '24/7 AI Chat', description: 'Engage visitors instantly with intelligent conversations' },
    { icon: Mail, title: 'Email Automation', description: 'Automated personalized outreach that converts' },
    { icon: Phone, title: 'Voice AI Calls', description: 'Natural phone conversations powered by AI' },
    { icon: BarChart3, title: 'BANT Scoring', description: 'Automatic lead qualification with AI' },
    { icon: Calendar, title: 'Meeting Booking', description: 'Seamless calendar integration' },
    { icon: Shield, title: 'Enterprise Ready', description: 'Secure, scalable, reliable' },
    { icon: Bot, title: 'Custom AI Agents', description: 'Tailor agents to your unique sales process' },
    { icon: SquareKanbanIcon, title: 'CRM Integration', description: 'Sync data with your CRM in real-time' },
    { icon: Workflow, title: 'Full Automation', description: 'Engage leads on their preferred channels' },
  ];

  const plans = [
    { name: 'Free', price: '₹0', conversations: '50', features: ['Chat only', '1 Agent', 'Basic analytics'] },
    { name: 'Starter', price: '₹1,999', conversations: '200', features: ['Chat + Email', '2 Agents', 'BANT scoring', 'Email sequences'] },
    { name: 'Growth', price: '₹4,999', conversations: '500', features: ['All channels', '5 Agents', 'CRM sync', 'Priority support'], popular: true },
    { name: 'Pro', price: '₹9,999', conversations: '2000', features: ['Everything', 'Unlimited agents', 'Voice calls', 'API access', 'Custom training'] },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">u8u<span className="text-primary">.ai</span></Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-up"><Button>Sign Up</Button></Link>
            <Link href="/sign-in"><Button variant="ghost">Sign In</Button></Link>
          </div>
        </nav>
      </header>

      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">AI Sales Agents That<br /><span className="text-primary">Never Sleep</span></h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Automate lead qualification, engagement, and meeting booking with AI agents that work 24/7.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up"><Button size="lg" className='border-2'>Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            {/* <Link href="#pricing"><Button variant="outline" size="lg">View Pricing</Button></Link> */}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Why Teams Choose u8u.ai */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Why Teams Choose <span className="text-primary">u8u.ai</span>
            </h2>
            <p className="text-gray-500">A new standard for intelligent sales systems.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Capability</th>
                  <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Automation</th>
                  <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">AI Tools</th>
                  <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">u8u.ai</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Understands customer intent', '✕', '⚠', '✓ Intelligent AI'],
                  ['Real-time decision making', 'Rule-based', 'Basic', '✓ Dynamic AI'],
                  ['Handles objections', '✕', 'Weak', '✓ Human-like'],
                  ['Guides buying decision', '✕', 'Partial', '✓ Smart guidance'],
                  ['Closes deals', '✕', '✕', '✓ Revenue-focused'],
                  ['Multi-channel support', '✕', 'Partial', '✓ Full coverage'],
                  ['Complete system', '✕', '✕', '✓ End-to-End'],
                  ['Lead auto-qualification', 'Partial', 'Weak', '✓ BANT scoring'],
                  ['Voice AI calling', '✕', '✕', '✓ Native support'],
                  ['Works 24/7 autonomously', '✕', 'Partial', '✓ Always on'],
                ].map(([capability, auto, aiTools, u8u], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-3 text-gray-700 border-b text-center">{capability}</td>
                    <td className="px-6 py-3 text-center border-b">
                      <span className={auto === '✕' ? 'text-red-500' : auto === '⚠' ? 'text-yellow-500' : 'text-yellow-600 text-l font-medium'}>{auto}</span>
                    </td>
                    <td className="px-6 py-3 text-center border-b">
                      <span className={aiTools === '✕' ? 'text-red-500' : 'text-yellow-600 text-l font-medium'}>{aiTools}</span>
                    </td>
                    <td className="px-6 py-3 text-center  border-b ">
                      <span className="text-violet-600 text-l font-bold">{u8u}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <footer className="border-t py-8 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Fuelo Technologies (OPC) Private Limited. Built for Startups.</p>
      </footer>

    </div>
  );
}