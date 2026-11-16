import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import PageHero from '../components/PageHero'

export default function NotFoundPage() {
  return (
    <div>
      <PageHero
        eyebrow="404"
        title="This coordinate is empty."
        intro="The page you requested does not exist. It may have moved, or the link may be mistyped."
      >
        <Link to="/" className="btn-primary mt-8">
          Return home <ArrowRight size={14} />
        </Link>
      </PageHero>
      <div className="h-24" />
    </div>
  )
}
