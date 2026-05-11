import Hero from '../sections/Hero.jsx'
import Calendar from '../sections/Calendar.jsx'
import LiveryViewer from '../sections/LiveryViewer.jsx'
import Drivers from '../sections/Drivers.jsx'
import News from '../sections/News.jsx'
import Staff from '../sections/Staff.jsx'

export default function Home() {
  return (
    <main>
      <section id="home">
        <Hero />
      </section>
      <section id="calendar">
        <Calendar />
      </section>
      <section id="liveries">
        <LiveryViewer />
      </section>
      <section id="drivers">
        <Drivers />
      </section>
      <section id="news">
        <News />
      </section>
      <section id="staff">
        <Staff />
      </section>
    </main>
  )
}
