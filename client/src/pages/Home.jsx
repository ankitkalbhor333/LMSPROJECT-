import Hero from "../components/homecomponent/Hero";
import WhyChoose from "../components/homecomponent/WhyChoose";
import CoursePage from "../components/homecomponent/CoursePage";
import VideoTestimonials from "../components/homecomponent/VideoTestimonials";
import Testimonials from "../components/homecomponent/Testimonials";
import StoryPage from "../components/homecomponent/StoryPage";
import Footer from "../components/homecomponent/Footer";
import HeroFeatures from "../components/homecomponent/HeroFeatures";

const Home = () => {
  return (
    <>
      <Hero />
      <VideoTestimonials />
      <CoursePage />
      <WhyChoose />
      <HeroFeatures />
      <Testimonials />
      <StoryPage/>
      <Footer />
    </>
  );
};

export default Home;