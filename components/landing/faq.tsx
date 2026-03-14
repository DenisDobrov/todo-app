import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need a technical background to get started?",
    answer:
      "Not at all! Our beginner track is designed for people with no prior coding experience. We start from the fundamentals and gradually build up your skills. Many of our most successful graduates came from non-technical backgrounds like marketing, finance, and healthcare.",
  },
  {
    question: "How long does it take to complete a learning path?",
    answer:
      "Most learning paths take 4-8 months to complete, depending on your pace and prior experience. Our flexible curriculum allows you to learn at your own speed, whether you're studying full-time or balancing learning with a job.",
  },
  {
    question: "What kind of projects will I build?",
    answer:
      "You'll build real-world AI applications including image classifiers, natural language processing systems, recommendation engines, and more. These projects are designed to be portfolio-ready, giving you tangible work to show potential employers.",
  },
  {
    question: "Do you offer job placement assistance?",
    answer:
      "Yes! Our Professional and Enterprise plans include career coaching, resume review, interview preparation, and access to our hiring partner network. We've helped thousands of graduates land AI roles at top companies.",
  },
  {
    question: "Can I switch learning paths if I change my mind?",
    answer:
      "Absolutely. You can switch paths at any time, and your progress will be preserved. Many learners explore multiple paths before finding their focus. Our advisors can help you make the right choice for your career goals.",
  },
  {
    question: "Is there a money-back guarantee?",
    answer:
      "Yes, we offer a 30-day money-back guarantee on all plans. If you're not satisfied with the program within the first 30 days, we'll give you a full refund, no questions asked.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about AI Career Shift.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-foreground hover:text-accent">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
