import WardrobeCollectionPage from '../components/WardrobeCollectionPage';

export default function AccessoriesPage() {
  return (
    <WardrobeCollectionPage
      kind="accessories"
      pageTag="Аксессуары"
      title={<>Мои <em>аксессуары</em></>}
      subtitle="Держи украшения, ремни, очки и другие детали отдельно, чтобы быстрее завершать образ."
      emptyIcon="👜"
      emptyTitle="Аксессуаров пока нет"
      emptyDesc="Добавь часы, украшения, ремни или очки, и ассистент начнёт учитывать их в рекомендациях."
      addLabel="+ Добавить аксессуар"
      baseUrl="/accessories"
    />
  );
}
