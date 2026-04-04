import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

function UnitItem({ unit }) {

  const handleDragEnd = (result) => {

    if (!result.destination) return;

    const items = Array.from(unit.lectures);

    const [reordered] = items.splice(result.source.index, 1);

    items.splice(result.destination.index, 0, reordered);

    console.log(items);
  };

  return (

    <DragDropContext onDragEnd={handleDragEnd}>

      <Droppable droppableId="lectures">

        {(provided) => (

          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >

            {unit.lectures.map((lecture, index) => (

              <Draggable
                key={lecture._id}
                draggableId={lecture._id}
                index={index}
              >

                {(provided) => (

                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      padding:10,
                      marginBottom:8,
                      background:"#f5f5f5",
                      ...provided.draggableProps.style
                    }}
                  >

                    📺 {lecture.title}

                  </div>

                )}

              </Draggable>

            ))}

            {provided.placeholder}

          </div>

        )}

      </Droppable>

    </DragDropContext>

  );
}

export default UnitItem;