export default function PendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <h2 className="text-xl font-semibold text-yellow-700">Compte en attente</h2>
        <p className="mt-2 text-gray-600">
          Votre compte est en attente d'approbation par le responsable. 
          Vous serez notifié dès qu'il sera validé.
        </p>
      </div>
    </div>
  )
}
