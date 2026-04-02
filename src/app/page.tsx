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
            <Link href="/sign-up"><Button size="lg">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="#pricing"><Button variant="outline" size="lg">View Pricing</Button></Link>
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

      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-6 rounded-xl border ${plan.popular ? 'border-primary ring-2 ring-primary' : ''}`}>
                {plan.popular && <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-xl font-semibold mt-2">{plan.name}</h3>
                <p className="text-3xl font-bold my-4">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                <p className="text-sm text-gray-500 mb-4">{plan.conversations} conversations/mo</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-500" />{f}</li>)}
                </ul>
                <Link href="/sign-up"><Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>Get Started</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* <LandingChat /> */}
      <footer className="border-t py-8 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Fuelo Technologies. Built for Bangalore Startups.</p>
      </footer>

    </div>
  );
}