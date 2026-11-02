import { products } from './data/dummyProducts';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">CompuStore SV</h1>
        <p className="text-gray-600">Catálogo de Productos</p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
              <img src={product.imageUrl} alt={product.name} className="h-40 w-full object-cover mb-4 rounded" />
              <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
              <p className="text-blue-600 font-bold text-xl mb-2">${product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mb-4">{product.stock} Disponible(s)</p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center border rounded">
                  <button className="px-2 py-1 bg-gray-200 hover:bg-gray-300">-</button>
                  <span className="px-4">1</span>
                  <button className="px-2 py-1 bg-gray-200 hover:bg-gray-300">+</button>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App