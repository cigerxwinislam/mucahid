// Bismillahirahmanirahim



import Carousel from 'react-bootstrap/Carousel';
import Image from 'next/image';
import mmwene from '../../public/images.jpeg';

import mmal from '../../public/mmal.png'

import mmkargeh from '../../public/kargeh.jpeg'
import Mwene from '@/components/Card';
function Wene() {
  return (
    <Carousel>
      <Carousel.Item>  
      <Mwene nav="Arabalar " wene="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBe0lV8LpOoyStij_2yTRfXYuu4uLtkzZzl_GB_sPGbqWb4oQsIwp22sW7&s=10"/>
      </Carousel.Item>
      <Carousel.Item>
      
       <Mwene nav="İş İlanları" />
      </Carousel.Item>
      <Carousel.Item>

      <Mwene nav="Evler" wene="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwuaKa8s-uVM_IwEHhxOm_S9IEIzx7TXsGn0hgOYyQkXqzMSPyXw_RvkU&s=10"/>
      </Carousel.Item>
      <Carousel.Item>

<Mwene/>
</Carousel.Item>




<Carousel.Item>

<Mwene/>
</Carousel.Item>
    </Carousel>
  );
}

export default Wene;