// will automatically sync with browser's indexed db, so we don't have to do anything additional
// if you don't use firestore then you have to manually code it:
// - https://javascript.info/indexeddb

db.enablePersistence().catch(error => {
  if (error.code === 'failed-precondition') {
    console.log('persistence failed. Probably multiple tabs opened at once')
  }
  if (error.code === 'unimplemented') {
    console.log('persistence is not available. Lack of browser support')
  }
})

// realtime listener to changes to recipes collection in firestore
db.collection('recipes').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(change => {
    // console.log('Firestore coll change: ', {
    //   change: change.doc.data()
    // })
    const recipeId = change.doc.id;

    if(change.type === 'added') {
      //add doc to the page
      renderRecipe({data: change.doc.data(), id: recipeId})
    }

    if(change.type === 'removed') {
      //remove doc to the page
      removeRecipe({id: recipeId})
    }
  });
})

// add new recipe
const form = document.querySelector('form');
form.addEventListener('submit', event => {
  event.preventDefault();
  const recipe = {
    title: form.title.value,
    ingredients: form.ingredients.value
  }

  db.collection('recipes')
    .add(recipe)
    .catch(error => {
      console.log('Add recipe error: ', {error})
    })

    form.title.value = '';
    form.ingredients.value = '';
})

// delete recipe
const recipeContainer = document.querySelector('.recipes');
recipeContainer.addEventListener('click', event => {
  const isDeleteButton = event.target.tagName === 'I';
console.log({
  event
})
  if (isDeleteButton) {
    const id = event.target.getAttribute('data-id');

    db.collection('recipes')
      .doc(id)
      .delete()
      .catch(error => {
        console.log('Delete recipe error: ', {error})
      })
  }
})