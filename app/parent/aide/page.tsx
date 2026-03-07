'use client';

import Link from 'next/link';

export default function ParentAidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Aide</h1>
            <Link
              href="/parent/calendar"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Retour au Planning
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connexion</h2>
            <p>
              Il est plus facile d&apos;accéder à l&apos;application avec son propre mot de passe.
              Cela évite de devoir cocher la case &quot;utiliser un code de connexion&quot; et on se connecte plus rapidement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Changer le mot de passe</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Pour la première fois :</strong> laissez vide la première case, renseignez le nouveau mot de passe
                et confirmez-le une seconde fois.
              </li>
              <li>
                <strong>Pour modifier ensuite :</strong> renseignez l&apos;ancien mot de passe dans le premier champ,
                puis le nouveau mot de passe et enfin confirmez.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Saisie des présences et absences</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Vous pouvez cliquer sur le mois en cours pour sélectionner tout le mois.</li>
              <li>Ensuite vous pouvez modifier les jours un à un.</li>
              <li><span className="inline-block w-4 h-4 bg-green-500 rounded align-middle mr-1"></span> Si la case devient verte, l&apos;enfant est bien enregistré <strong>Présent</strong>.</li>
              <li><span className="inline-block w-4 h-4 bg-red-500 rounded align-middle mr-1"></span> Si la case est rouge, l&apos;enfant est bien enregistré <strong>Absent</strong>.</li>
              <li>On ne peut renseigner que les jours où un événement est proposé.</li>
              <li><span className="inline-block w-4 h-4 bg-blue-500 rounded-full align-middle mr-1"></span> Un rond bleu = un entraînement.</li>
              <li><span className="inline-block w-4 h-4 bg-gray-400 rounded-full align-middle mr-1"></span> Un rond gris = un tournoi, un match ou un plateau.</li>
              <li>Si la case devient grise, c&apos;est pour indiquer que vous avez sélectionné cette journée. Cliquez sur une autre case pour vérifier si la couleur a bien été modifiée.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Modifications d&apos;événements</h2>
            <p>
              Si un événement auquel vous avez répondu est modifié, il est noté dans la case :
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Type</strong> : si le type d&apos;événement a changé (entraînement, match...)</li>
              <li><strong>Horaire</strong> : si l&apos;horaire a changé</li>
              <li><strong>Lieu</strong> : si c&apos;est le lieu qui a changé</li>
              <li><strong>Annulé</strong> : si l&apos;événement est annulé</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Mot de passe oublié</h2>
            <p>
              Si vous avez oublié votre mot de passe, vous pouvez cliquer en bas de la page de connexion
              sur &quot;Mot de passe oublie&quot; pour recevoir un nouveau code de connexion par mail.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Raccourci sur le téléphone</h2>
            <p>
              Vous pouvez enregistrer le code dans votre téléphone et ajouter la page à l&apos;écran d&apos;accueil
              pour avoir un raccourci sur le telephone. Ce n&apos;est pas une application sur le store :
              pas d&apos;appli dans l&apos;Apple Store ni dans le Play Store.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Recharger l&apos;application</h2>
            <p>
              Si vous ouvrez l&apos;application et que la date et l&apos;heure ne sont pas a jour,
              c&apos;est qu&apos;il faut recharger l&apos;application en cliquant sur le bouton <strong>Actualiser</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
