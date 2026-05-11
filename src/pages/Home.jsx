import Hero from '../sections/Hero.jsx'
import Calendar from '../sections/Calendar.jsx'
import Drivers from '../sections/Drivers.jsx'
import News from '../sections/News.jsx'
import Staff from '../sections/Staff.jsx'
import StatBar from '../components/StatBar.jsx'
import SectionDivider from '../components/SectionDivider.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <>
      <main>
        <section id="home">
          <Hero />
        </section>

        <StatBar />
        <SectionDivider />

        <section id="calendar">
          <Calendar />
        </section>

        <SectionDivider flip />

        <section id="drivers">
          <Drivers />
        </section>

        <SectionDivider />

        <section id="news">
          <News />
        </section>

        <SectionDivider flip />

        <section id="staff">
          <Staff />
        </section>
      </main>

      <Footer />
    </>
  )
}
