import Hero from "../components/homecomponent/Hero";
import WhyChoose from "../components/homecomponent/WhyChoose";
import CoursePage from "../components/homecomponent/CoursePage";
import VideoTestimonials from "../components/homecomponent/VideoTestimonials";
import Testimonials from "../components/homecomponent/Testimonials";
import StoryPage from "../components/homecomponent/StoryPage";
import Footer from "../components/homecomponent/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import HeroFeatures from "../components/homecomponent/HeroFeatures";

const Home = () => {
  return (
    <>
      <Hero />
      <WhyChoose />
      <HeroFeatures />
      <CoursePage />
      <VideoTestimonials />
      <Testimonials />
      <StoryPage/>
      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default Home;