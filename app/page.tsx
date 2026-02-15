import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Stade Béthunois
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Gestion des présences
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-4 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
